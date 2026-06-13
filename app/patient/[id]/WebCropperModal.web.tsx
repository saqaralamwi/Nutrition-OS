import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal } from 'react-native';
// @ts-ignore
import { Cropper } from 'react-cropper';
// @ts-ignore
import 'cropperjs/dist/cropper.css';
import ArabicText from '../../../src/presentation/components/ArabicText';
import { Ionicons } from '@expo/vector-icons';

interface WebCropperModalProps {
  visible: boolean;
  imageSrc: string;
  onClose: () => void;
  onCrop: (croppedDataUrl: string) => void;
}

export default function WebCropperModal({ visible, imageSrc, onClose, onCrop }: WebCropperModalProps) {
  const cropperRef = useRef<any>(null);

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const croppedCanvas = cropper.getCroppedCanvas();
      if (croppedCanvas) {
        onCrop(croppedCanvas.toDataURL());
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ArabicText bold style={styles.title}>تحديد وقص منطقة الفحوصات</ArabicText>
          </View>

          {/* Floating Tooltip Instruction */}
          <View style={styles.tooltipContainer}>
            <View style={styles.tooltip}>
              <ArabicText bold style={styles.tooltipText}>
                🔧 يرجى قص الصورة لتحديد منطقة الفحوصات والنتائج فقط...
              </ArabicText>
            </View>
          </View>

          {/* Cropper Area */}
          <View style={styles.cropperWrapper}>
            <Cropper
              ref={cropperRef}
              src={imageSrc}
              style={{ height: '100%', width: '100%' }}
              initialAspectRatio={NaN} // Free aspect ratio
              guides={true}
              viewMode={1}
              background={false}
              responsive={true}
              autoCropArea={1}
              checkOrientation={false}
            />
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <ArabicText bold style={styles.btnText}>إلغاء</ArabicText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cropBtn} onPress={handleCrop}>
              <Ionicons name="analytics" size={18} color="#FFFFFF" />
              <ArabicText bold style={styles.btnText}>استخراج البيانات المحددة</ArabicText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)', // Dark overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B', // Midnight-Slate
    borderRadius: 12,
    width: '100%',
    maxWidth: 700,
    height: '80%',
    borderWidth: 1,
    borderColor: '#475569',
    overflow: 'hidden',
    display: 'flex',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'right',
  },
  tooltipContainer: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  tooltip: {
    backgroundColor: '#1B6B4A', // Forest Green
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
  },
  cropperWrapper: {
    flex: 1,
    backgroundColor: '#0F172A',
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 12,
  },
  cropBtn: {
    flexDirection: 'row',
    backgroundColor: '#1B6B4A', // Forest Green
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: '#475569',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
