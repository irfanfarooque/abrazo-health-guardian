import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, Linking } from 'react-native';
import { Card, Text, Button, ActivityIndicator, Chip, IconButton } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useMedicalRecords } from '@/hooks/useMedicalRecords';
import { format } from 'date-fns';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function MedicalRecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { records, isLoading, deleteRecord, updateRecord } = useMedicalRecords();
  const [isDeleting, setIsDeleting] = useState(false);

  const record = records.find((r) => r.id === id);

  const handleOpenFile = useCallback(async () => {
    if (record?.file_url) {
      const canOpen = await Linking.canOpenURL(record.file_url);
      if (canOpen) {
        await Linking.openURL(record.file_url);
      } else {
        Alert.alert('Error', 'Unable to open file. Please check your internet connection.');
      }
    }
  }, [record]);

  const handleDelete = useCallback(async () => {
    if (!record) return;

    Alert.alert('Delete Record', `Are you sure you want to delete "${record.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await deleteRecord(record.id);
            Alert.alert('Success', 'Record deleted', [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]);
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete record');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  }, [record, deleteRecord, router]);

  const handleToggleImportant = useCallback(async () => {
    if (!record) return;

    try {
      await updateRecord(record.id, { is_important: !record.is_important });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update record');
    }
  }, [record, updateRecord]);

  if (isLoading) {
    return (
      <ScreenContainer title="Loading..." subtitle="Fetching record details.">
        <ActivityIndicator style={styles.loader} />
      </ScreenContainer>
    );
  }

  if (!record) {
    return (
      <ScreenContainer title="Record not found" subtitle="This record may have been deleted.">
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.errorText}>Record not found. Please go back and try again.</Text>
            <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </ScreenContainer>
    );
  }

  const isImage = record.file_type?.startsWith('image/');
  const isPDF = record.file_type === 'application/pdf';

  return (
    <ScreenContainer
      title={record.title}
      subtitle={record.record_type.replace('_', ' ')}
      headerRight={
        <View style={styles.headerActions}>
          <IconButton
            icon={record.is_important ? 'star' : 'star-outline'}
            iconColor={record.is_important ? '#F59E0B' : '#64748B'}
            onPress={handleToggleImportant}
          />
          <IconButton icon="delete-outline" iconColor="#DC2626" onPress={handleDelete} />
        </View>
      }
    >
      <ScrollView style={styles.scrollView}>
        {/* File Preview */}
        {record.file_url && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.fileHeader}>
                <Ionicons
                  name={isPDF ? 'document-text' : isImage ? 'image' : 'document'}
                  size={32}
                  color="#2563EB"
                />
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>{record.title}</Text>
                  {record.file_size_bytes && (
                    <Text style={styles.fileSize}>
                      {(record.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  )}
                </View>
              </View>
              {isImage && (
                <Image source={{ uri: record.file_url }} style={styles.previewImage} resizeMode="contain" />
              )}
              <Button
                mode="contained"
                icon="open-outline"
                onPress={handleOpenFile}
                style={styles.openButton}
              >
                {isPDF ? 'Open PDF' : isImage ? 'View Full Image' : 'Open File'}
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Record Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Record Information</Text>

            {record.description && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{record.description}</Text>
              </View>
            )}

            {record.record_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{format(new Date(record.record_date), 'MMMM d, yyyy')}</Text>
              </View>
            )}

            {record.doctor_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Doctor:</Text>
                <Text style={styles.detailValue}>Dr. {record.doctor_name}</Text>
              </View>
            )}

            {record.hospital_clinic_name && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hospital/Clinic:</Text>
                <Text style={styles.detailValue}>{record.hospital_clinic_name}</Text>
              </View>
            )}

            {record.tags && record.tags.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tags:</Text>
                <View style={styles.tagsContainer}>
                  {record.tags.map((tag, index) => (
                    <Chip key={index} mode="outlined" style={styles.tag}>
                      {tag}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Uploaded:</Text>
              <Text style={styles.detailValue}>{format(new Date(record.created_at), 'MMMM d, yyyy')}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Extracted Text */}
        {record.extracted_text && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Extracted Text</Text>
              <Text style={styles.extractedText}>{record.extracted_text}</Text>
            </Card.Content>
          </Card>
        )}

        {!record.extracted_text && record.file_url && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Text Extraction</Text>
              <Text style={styles.hintText}>
                AI-powered OCR text extraction will be available in future updates. This will automatically extract
                text from PDFs and images for easy searching.
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  loader: {
    paddingVertical: 48,
  },
  card: {
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    marginBottom: 16,
  },
  backButton: {
    marginTop: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  fileSize: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  openButton: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#1E293B',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    height: 28,
  },
  extractedText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    marginTop: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
