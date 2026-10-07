import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useConfirm } from '@/components/ConfirmDialog';
import { TextField } from '@/components/TextField';
import { useHoverable } from '@/lib/useHoverable';
import { sanitizeImage } from '@/lib/images';
import { useTheme } from '@/theme/ThemeProvider';

import { useAddNotePhoto, useDeleteNotePhoto, useNotePhotos, useRenameNotePhoto } from './hooks';
import type { NotePhoto } from './types';

/** Photos attached to a note — picked from the device library, named, and stored as a base64
 * data URI in the same local SQLite database as everything else (see schema.ts v3). */
export function NotePhotos({ noteId }: { noteId: string }) {
  const theme = useTheme();
  const { data: photos } = useNotePhotos(noteId);
  const addPhoto = useAddNotePhoto(noteId);
  const [picked, setPicked] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [viewing, setViewing] = useState<NotePhoto | null>(null);
  const [pickError, setPickError] = useState('');

  const onPick = async () => {
    setPickError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPickError('Photo library access was declined — enable it in your device settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.6,
    });
    const asset = result.canceled ? null : result.assets[0];
    if (!asset?.base64) return;
    const raw = `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`;
    // Strips the EXIF block — a phone photo carries the GPS coordinates and the
    // time it was taken, and photos travel with a shared trip.
    try {
      setPicked(await sanitizeImage(raw));
    } catch {
      setPickError('That image could not be read. Try a different one.');
      return;
    }
    setPendingName('');
  };

  const onConfirmAdd = async () => {
    if (!picked) return;
    const name = pendingName.trim() || `Photo ${(photos?.length ?? 0) + 1}`;
    await addPhoto.mutateAsync({ name, data: picked });
    setPicked(null);
    setPendingName('');
  };

  return (
    <View style={{ gap: theme.space.sm }}>
      <Text style={[theme.type.title, { color: theme.colors.text }]}>Photos</Text>

      {photos && photos.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
          {photos.map((photo) => (
            <PhotoThumb key={photo.id} photo={photo} onPress={() => setViewing(photo)} />
          ))}
        </View>
      ) : null}

      {picked ? (
        <View
          style={{
            gap: theme.space.sm,
            padding: theme.space.sm,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.surfaceAlt,
          }}
        >
          <Image
            source={{ uri: picked }}
            style={{ width: 120, height: 120, borderRadius: theme.radius.sm }}
            resizeMode="cover"
          />
          <TextField
            value={pendingName}
            onChangeText={setPendingName}
            placeholder="Photo name"
            autoFocus
            name="photo-name"
          />
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onPress={onConfirmAdd}
              disabled={addPhoto.isPending}
            >
              Save photo
            </Button>
            <Button variant="secondary" size="sm" onPress={() => setPicked(null)}>
              Cancel
            </Button>
          </View>
        </View>
      ) : (
        <Button variant="dashed" onPress={onPick}>
          + Add photo
        </Button>
      )}

      {pickError ? (
        <Text style={[theme.type.caption, { color: theme.colors.warn }]}>{pickError}</Text>
      ) : null}

      {viewing ? (
        <PhotoViewer noteId={noteId} photo={viewing} onClose={() => setViewing(null)} />
      ) : null}
    </View>
  );
}

function PhotoThumb({ photo, onPress }: { photo: NotePhoto; onPress: () => void }) {
  const theme = useTheme();
  const { hovered, onHoverIn, onHoverOut } = useHoverable();

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={({ pressed }) => ({
        width: 100,
        gap: 4,
        opacity: pressed ? 0.75 : hovered ? 0.9 : 1,
      })}
    >
      <Image
        source={{ uri: photo.data }}
        style={{ width: 100, height: 100, borderRadius: theme.radius.sm }}
        resizeMode="cover"
      />
      <Text numberOfLines={1} style={[theme.type.caption, { color: theme.colors.textMuted }]}>
        {photo.name}
      </Text>
    </Pressable>
  );
}

function PhotoViewer({
  noteId,
  photo,
  onClose,
}: {
  noteId: string;
  photo: NotePhoto;
  onClose: () => void;
}) {
  const theme = useTheme();
  const renamePhoto = useRenameNotePhoto(noteId);
  const deletePhoto = useDeleteNotePhoto(noteId);
  const { confirm, dialog } = useConfirm();
  const [name, setName] = useState(photo.name);

  const onSaveName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== photo.name) {
      renamePhoto.mutate({ id: photo.id, name: trimmed });
    }
  };

  const onDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete this photo?',
      message: `"${photo.name}" will be deleted for good.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    await deletePhoto.mutateAsync(photo.id);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(23,17,11,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.space.lg,
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            padding: theme.space.md,
            gap: theme.space.sm,
          }}
        >
          <Image
            source={{ uri: photo.data }}
            style={{ width: '100%', aspectRatio: 1, borderRadius: theme.radius.md }}
            resizeMode="contain"
          />
          <TextField
            value={name}
            onChangeText={setName}
            onBlur={onSaveName}
            placeholder="Photo name"
            name="photo-view-name"
          />
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            <Button variant="danger" size="sm" fullWidth onPress={onDelete}>
              Delete photo
            </Button>
            <Button variant="secondary" size="sm" onPress={onClose}>
              Close
            </Button>
          </View>
        </Pressable>
      </Pressable>
      {dialog}
    </Modal>
  );
}
