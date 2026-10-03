import { View, StyleSheet, Text, Linking } from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { MedicalRecord } from '@/types/medical-record';
import { format } from 'date-fns';

type Props = {
  record: MedicalRecord;
  onPress?: () => void;
  onDelete?: () => void;
};

const recordTypeIcons: Record<string, string> = {
  lab_report: 'flask-outline',
  prescription: 'receipt-outline',
  discharge_summary: 'document-text-outline',
  xray: 'scan-outline',
  scan: 'scan-outline',
  other: 'document-outline',
};

const recordTypeColors: Record<string, string> = {
  lab_report: '#3B82F6',
  prescription: '#10B981',
  discharge_summary: '#8B5CF6',
  xray: '#F59E0B',
  scan: '#EF4444',
  other: '#64748B',
};

export function MedicalRecordCard({ record, onPress, onDelete }: Props) {
  const iconName = recordTypeIcons[record.record_type] || 'document-outline';
  const iconColor = recordTypeColors[record.record_type] || '#64748B';

  const handleOpenFile = async () => {
    if (record.file_url) {
      const canOpen = await Linking.canOpenURL(record.file_url);
      if (canOpen) {
        await Linking.openURL(record.file_url);
      }
    }
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
            <Ionicons name={iconName} size={24} color={iconColor} />
          </View>
          <View style={styles.info}>
            <Text style={styles.title}>{record.title}</Text>
            <Text style={styles.type}>{record.record_type.replace('_', ' ')}</Text>
            {record.record_date && (
              <Text style={styles.date}>{format(new Date(record.record_date), 'MMM d, yyyy')}</Text>
            )}
            {record.doctor_name && <Text style={styles.doctor}>Dr. {record.doctor_name}</Text>}
            {record.hospital_clinic_name && (
              <Text style={styles.hospital}>{record.hospital_clinic_name}</Text>
            )}
          </View>
          {record.is_important && (
            <View style={styles.importantBadge}>
              <Ionicons name="star" size={16} color="#F59E0B" />
            </View>
          )}
        </View>

        {record.description && (
          <Text style={styles.description} numberOfLines={2}>
            {record.description}
          </Text>
        )}

        {record.tags && record.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {record.tags.slice(0, 3).map((tag, index) => (
              <Chip key={index} mode="outlined" compact style={styles.tag}>
                {tag}
              </Chip>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          {record.file_url && (
            <Button
              mode="outlined"
              compact
              icon="open-outline"
              onPress={(e) => {
                e.stopPropagation();
                handleOpenFile();
              }}
            >
              View File
            </Button>
          )}
          {record.file_size_bytes && (
            <Text style={styles.fileSize}>
              {(record.file_size_bytes / 1024 / 1024).toFixed(2)} MB
            </Text>
          )}
          {onDelete && (
            <Button
              mode="text"
              compact
              textColor="#DC2626"
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              Delete
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  type: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 12,
    color: '#94A3B8',
  },
  doctor: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  hospital: {
    fontSize: 12,
    color: '#64748B',
  },
  importantBadge: {
    alignSelf: 'flex-start',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    height: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  fileSize: {
    fontSize: 12,
    color: '#94A3B8',
  },
});

