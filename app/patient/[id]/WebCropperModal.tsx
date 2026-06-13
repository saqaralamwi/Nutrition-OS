import React from 'react';

interface WebCropperModalProps {
  visible: boolean;
  imageSrc: string;
  onClose: () => void;
  onCrop: (croppedDataUrl: string) => void;
}

export default function WebCropperModal({ visible, imageSrc, onClose, onCrop }: WebCropperModalProps) {
  return null;
}
