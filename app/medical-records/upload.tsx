import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert, Image } from 'react-native';
import {
  Button,
  TextInput,
  Text,
  SegmentedButtons,
  HelperText,
  ActivityIndicator,
  Card,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { useMedicalRecords } from '@/hooks/useMedicalRecords';
import { pickFile, type FileSource } from '@/services/storage/fileUpload';
import type { MedicalRecordType } from '@/types/medical-record';
import { format } from 'date-fns';

export default function MedicalRecordUploadScreen() {
  const router = useRouter();
  const { addRecord, supabaseReady, isLoading } = useMedicalRecords();
  const [recordType, setRecordType] = useState<MedicalRecordType>('lab_report');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [recordDate, setRecordDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tags, setTags] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [fileSource, setFileSource] = useState<FileSource | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickFile = useCallback(async (source: FileSource) => {
    try {
      const file = await pickFile(source);
      if (file) {
        setSelectedFile(file);
        setFileSource(source);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to pick file');
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await addRecord({
        record_type: recordType,
        title: title.trim(),
        description: description.trim() || null,
        doctor_name: doctorName.trim() || null,
        hospital_clinic_name: hospitalName.trim() || null,
        record_date: recordDate || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        is_important: isImportant,
        fileSource: fileSource || undefined,
      });

      Alert.alert('Success', 'Medical record uploaded successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload record');
    } finally {
      setIsUploading(false);
    }
  }, [
    title,
    recordType,
    description,
    doctorName,
    hospitalName,
    recordDate,
    tags,
    isImportant,
    fileSource,
    addRecord,
    router,
  ]);

  return (
    <ScreenContainer title="Upload record" subtitle="Attach PDFs, images, or notes.">
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          {/* Record Type */}
          <View style={styles.section}>
            <HelperText type="info" style={styles.sectionLabel}>
              Record Type *
            </HelperText>
            <SegmentedButtons
              value={recordType}
              onValueChange={(value) => setRecordType(value as MedicalRecordType)}
              buttons={[
                { value: 'lab_report', label: 'Lab' },
                { value: 'prescription', label: 'Rx' },
                { value: 'discharge_summary', label: 'Discharge' },
                { value: 'xray', label: 'X-Ray' },
                { value: 'scan', label: 'Scan' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </View>

          <TextInput
            label="Title *"
            mode="outlined"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Blood Test Results, Prescription #123"
            disabled={isUploading || !supabaseReady}
          />

          <TextInput
            label="Description (optional)"
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            placeholder="Additional notes about this record"
            multiline
            numberOfLines={3}
            disabled={isUploading || !supabaseReady}
          />

          <TextInput
            label="Doctor Name (optional)"
            mode="outlined"
            value={doctorName}
            onChangeText={setDoctorName}
            placeholder="Dr. John Smith"
            disabled={isUploading || !supabaseReady}
          />

          <TextInput
            label="Hospital/Clinic (optional)"
            mode="outlined"
            value={hospitalName}
            onChangeText={setHospitalName}
            placeholder="Hospital or clinic name"
            disabled={isUploading || !supabaseReady}
          />

          <TextInput
            label="Record Date (optional)"
            mode="outlined"
            value={recordDate}
            onChangeText={setRecordDate}
            placeholder="YYYY-MM-DD"
            disabled={isUploading || !supabaseReady}
          />

          <TextInput
            label="Tags (optional)"
            mode="outlined"
            value={tags}
            onChangeText={setTags}
            placeholder="Comma-separated tags, e.g., diabetes, annual checkup"
            disabled={isUploading || !supabaseReady}
          />

          {/* File Selection */}
          <View style={styles.section}>
            <HelperText type="info" style={styles.sectionLabel}>
              Attach File (optional)
            </HelperText>
            <View style={styles.fileButtons}>
              <Button
                mode="outlined"
                icon="document"
                onPress={() => handlePickFile('document')}
                disabled={isUploading || !supabaseReady}
                style={styles.fileButton}
              >
                Document
              </Button>
              <Button
                mode="outlined"
                icon="camera"
                onPress={() => handlePickFile('camera')}
                disabled={isUploading || !supabaseReady}
                style={styles.fileButton}
              >
                Camera
              </Button>
              <Button
                mode="outlined"
                icon="image"
                onPress={() => handlePickFile('gallery')}
                disabled={isUploading || !supabaseReady}
                style={styles.fileButton}
              >
                Gallery
              </Button>
            </View>

            {selectedFile && (
              <Card style={styles.fileCard}>
                <Card.Content>
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                  <Text style={styles.fileSize}>
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                  </Text>
                  {selectedFile.type.startsWith('image/') && (
                    <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
                  )}
                  <Button
                    mode="text"
                    compact
                    textColor="#DC2626"
                    onPress={() => setSelectedFile(null)}
                    style={styles.removeFileButton}
                  >
                    Remove
                  </Button>
                </Card.Content>
              </Card>
            )}
          </View>

          {error && <HelperText type="error">{error}</HelperText>}

          {!supabaseReady && (
            <HelperText type="error">
              Supabase not configured. Add keys to .env to enable record uploads.
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isUploading || isLoading}
            disabled={!supabaseReady || isUploading || isLoading || !title.trim()}
            style={styles.submitButton}
          >
            {isUploading ? 'Uploading...' : 'Upload Record'}
          </Button>

          <Button mode="text" onPress={() => router.back()} disabled={isUploading} style={styles.cancelButton}>
            Cancel
          </Button>

          <Text style={styles.hint}>
            💡 AI-powered OCR text extraction will be available in future updates. Files are securely stored in
            Supabase Storage.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  form: {
    gap: 16,
    paddingBottom: 24,
  },
  section: {
    marginVertical: 8,
  },
  sectionLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  fileButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  fileButton: {
    flex: 1,
    minWidth: 100,
  },
  fileCard: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  removeFileButton: {
    alignSelf: 'flex-end',
  },
  submitButton: {
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
