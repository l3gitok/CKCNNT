// src/app/products/ImageUploader.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

interface ImageUploaderProps {
  onUploadSuccess: (urls: string[]) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  onReset?: () => void;
  initialImages?: string[]; // Ảnh cũ để chỉnh sửa
}

interface CloudinaryResponse {
  secure_url?: string;
  error?: {
    message: string;
  };
}

export function ImageUploader({ 
  onUploadSuccess, 
  onUploadStart, 
  onUploadEnd,
  onReset,
  initialImages = []
}: ImageUploaderProps) {
  const [images, setImages] = useState<Array<{
    file: File | null; // null cho ảnh từ URL
    preview: string;
    originalPreview: string;
    crop: { x: number; y: number; width: number; height: number };
    brightness: number;
    contrast: number;
    saturation: number;
    rotation: number;
    isCropping: boolean;
  }>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 }); // percentage
  const [isCropping, setIsCropping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load ảnh cũ khi component mount
  useEffect(() => {
    if (initialImages.length > 0) {
      const loadedImages = initialImages.map(url => ({
        file: null, // Ảnh từ URL không có file
        preview: url,
        originalPreview: url,
        crop: { x: 10, y: 10, width: 80, height: 80 },
        brightness: 100,
        contrast: 100,
        saturation: 100,
        rotation: 0,
        isCropping: false,
      }));
      setImages(loadedImages);
      setCurrentImageIndex(0);
      setIsEditing(true);
    }
  }, [initialImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages = Array.from(files).map(file => {
      const previewUrl = URL.createObjectURL(file);
      return {
        file,
        preview: previewUrl,
        originalPreview: previewUrl, 
        crop: { x: 10, y: 10, width: 80, height: 80 },
        brightness: 100,
        contrast: 100,
        saturation: 100,
        rotation: 0,
        isCropping: false,
      };
    });

    // Lưu lại số lượng ảnh hiện tại trước khi thêm
    const currentImagesLength = images.length;
    
    setImages(prev => [...prev, ...newImages]);
    
    // Nếu chưa có ảnh nào, set index = 0, nếu đã có thì giữ nguyên index hiện tại
    if (currentImagesLength === 0) {
      setCurrentImageIndex(0);
      setIsEditing(true);
      
      // Reset current editing state
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setRotation(0);
      setCrop({ x: 10, y: 10, width: 80, height: 80 });
      setIsCropping(false);
    }
    // Nếu đã có ảnh, không reset state để giữ nguyên ảnh đang chỉnh sửa
    
    // Reset input để có thể chọn lại cùng file
    e.target.value = '';
  };

  const applyFilters = () => {
    const currentImage = images[currentImageIndex];
    if (!currentImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Tính toán kích thước sau khi xoay
      const isRotated90or270 = rotation === 90 || rotation === 270;
      const rotatedWidth = isRotated90or270 ? img.height : img.width;
      const rotatedHeight = isRotated90or270 ? img.width : img.height;
      
      // Tính crop từ phần trăm
      const cropX = (crop.x / 100) * rotatedWidth;
      const cropY = (crop.y / 100) * rotatedHeight;
      const cropWidth = (crop.width / 100) * rotatedWidth;
      const cropHeight = (crop.height / 100) * rotatedHeight;
      
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      ctx.save();
      
      // Di chuyển đến tâm canvas để xoay
      ctx.translate(cropWidth / 2, cropHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Áp dụng filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
      
      // Vẽ ảnh (đã xoay và crop)
      if (isRotated90or270) {
        ctx.drawImage(
          img,
          -img.height / 2 - cropX,
          -img.width / 2 - cropY,
          img.height,
          img.width
        );
      } else {
        ctx.drawImage(
          img,
          -img.width / 2 - cropX,
          -img.height / 2 - cropY,
          img.width,
          img.height
        );
      }
      
      ctx.restore();
      ctx.filter = 'none';
    };
    img.src = currentImage.preview;
  };

  const handleUpload = async () => {
    if (images.length === 0) return;

    onUploadStart();

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i]!;
        
        // Nếu ảnh không có file (ảnh cũ từ URL), giữ nguyên URL
        if (!image.file) {
          uploadedUrls.push(image.preview);
          continue;
        }

        let fileToUpload: File | Blob = image.file;

        // Nếu có crop hoặc filter, tạo ảnh mới từ canvas
        if (image.isCropping || image.brightness !== 100 || image.contrast !== 100 || image.saturation !== 100 || image.rotation !== 0) {
          // Temporarily set current index and states
          setCurrentImageIndex(i);
          setBrightness(image.brightness);
          setContrast(image.contrast);
          setSaturation(image.saturation);
          setRotation(image.rotation);
          setCrop(image.crop);
          setIsCropping(image.isCropping);
          
          // Wait for applyFilters to complete
          await new Promise(resolve => {
            requestAnimationFrame(() => {
              applyFilters();
              setTimeout(resolve, 100);
            });
          });

          const canvas = canvasRef.current;
          if (canvas) {
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9);
            });
            fileToUpload = new File([blob], image.file.name, { type: 'image/jpeg' });
          }
        }

        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json() as CloudinaryResponse;
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        } else {
          throw new Error(data.error?.message ?? "Upload thất bại");
        }
      }

      onUploadSuccess(uploadedUrls);
      
      // Giữ lại ảnh preview nhưng tắt chế độ chỉnh sửa
      setIsEditing(false);
      
    } catch (error) {
      console.error(error);
      alert("Upload ảnh thất bại!");
    } finally {
      onUploadEnd();
    }
  };

  const handleCancel = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setCurrentImageIndex(0);
    setIsEditing(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setCrop({ x: 10, y: 10, width: 80, height: 80 });
    setIsCropping(false);
    onReset?.();
  };

  // Apply filters khi slider thay đổi
  const handleFilterChange = () => {
    requestAnimationFrame(applyFilters);
  };

  const updateCurrentImage = (updates: Partial<typeof images[0]>) => {
    setImages(prev => prev.map((img, idx) => 
      idx === currentImageIndex ? { ...img, ...updates } : img
    ));
  };

  const confirmCrop = async () => {
    const currentImage = images[currentImageIndex];
    if (!currentImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    
    await new Promise<void>((resolve) => {
      img.onload = () => {
        // Kích thước ảnh gốc
        const imgWidth = img.width;
        const imgHeight = img.height;
        
        // Tính crop từ phần trăm sang pixel thực tế của ảnh
        const cropX = (crop.x / 100) * imgWidth;
        const cropY = (crop.y / 100) * imgHeight;
        const cropWidth = (crop.width / 100) * imgWidth;
        const cropHeight = (crop.height / 100) * imgHeight;
        
        // Set canvas size = kích thước vùng cắt
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        ctx.save();
        
        // Apply filters trước khi vẽ
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        
        ctx.drawImage(
          img,
          cropX, cropY, cropWidth, cropHeight,  // Vùng cắt từ ảnh gốc
          0, 0, cropWidth, cropHeight            // Vẽ vào canvas
        );
        
        ctx.restore();
        
        // Chuyển canvas thành blob URL mới
        canvas.toBlob((blob) => {
          if (blob) {
            const newPreviewUrl = URL.createObjectURL(blob);
            // Revoke old preview URL to prevent memory leak (nhưng giữ originalPreview)
            if (currentImage.preview !== currentImage.originalPreview) {
              URL.revokeObjectURL(currentImage.preview);
            }
            
            // Cập nhật preview với ảnh đã cắt
            updateCurrentImage({ 
              preview: newPreviewUrl,
              crop: { x: 0, y: 0, width: 100, height: 100 }, // Reset crop về full vì đã cắt rồi
              isCropping: false 
            });
            
            // Reset crop box về full
            setCrop({ x: 0, y: 0, width: 100, height: 100 });
            setIsCropping(false);
          }
          resolve();
        }, 'image/jpeg', 0.95);
      };
      img.src = currentImage.preview;
    });
  };

  const resetToOriginal = () => {
    const currentImage = images[currentImageIndex];
    if (!currentImage) return;

    updateCurrentImage({
      preview: currentImage.originalPreview,
      crop: { x: 10, y: 10, width: 80, height: 80 },
      brightness: 100,
      contrast: 100,
      saturation: 100,
      rotation: 0,
      isCropping: false
    });

    // Reset state
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setCrop({ x: 10, y: 10, width: 80, height: 80 });
    setIsCropping(false);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, idx) => idx !== index);
      if (currentImageIndex >= newImages.length) {
        setCurrentImageIndex(Math.max(0, newImages.length - 1));
      }
      return newImages;
    });
  };

  const handleRotate = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    updateCurrentImage({ rotation: newRotation });
    requestAnimationFrame(applyFilters);
  };



  const handleCropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCornerMouseDown = (e: React.MouseEvent<HTMLDivElement>, corner: 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(corner);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCropMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;
    
    if (isDragging) {
      // Di chuyển khung cắt
      setCrop(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX)),
        y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY)),
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isResizing) {
      // Resize khung cắt từ các góc
      setCrop(prev => {
        const newCrop = { ...prev };
        
        switch (isResizing) {
          case 'nw': // Góc trên trái
            newCrop.width = Math.max(20, Math.min(100, prev.width - deltaX));
            newCrop.height = Math.max(20, Math.min(100, prev.height - deltaY));
            newCrop.x = Math.max(0, prev.x + deltaX);
            newCrop.y = Math.max(0, prev.y + deltaY);
            break;
          case 'ne': // Góc trên phải
            newCrop.width = Math.max(20, Math.min(100 - prev.x, prev.width + deltaX));
            newCrop.height = Math.max(20, Math.min(100, prev.height - deltaY));
            newCrop.y = Math.max(0, prev.y + deltaY);
            break;
          case 'sw': // Góc dưới trái
            newCrop.width = Math.max(20, Math.min(100, prev.width - deltaX));
            newCrop.height = Math.max(20, Math.min(100 - prev.y, prev.height + deltaY));
            newCrop.x = Math.max(0, prev.x + deltaX);
            break;
          case 'se': // Góc dưới phải
            newCrop.width = Math.max(20, Math.min(100 - prev.x, prev.width + deltaX));
            newCrop.height = Math.max(20, Math.min(100 - prev.y, prev.height + deltaY));
            break;
        }
        
        return newCrop;
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCropMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };



  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Hình ảnh sản phẩm <span className="text-red-500">*</span>
      </label>
      <div className="mt-2">
        {images.length === 0 ? (
          <label 
            htmlFor="file-upload" 
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 transition hover:border-blue-500 hover:bg-blue-50"
          >
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm font-medium text-gray-700">Click để tải ảnh lên</p>
            <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF tối đa 10MB</p>
          </label>
        ) : (
          <div className="space-y-4">
            {/* Nút tải thêm ảnh */}
            <label 
              htmlFor="file-upload" 
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-3 transition hover:border-blue-500 hover:bg-blue-100"
            >
              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-blue-700">Tải thêm ảnh</span>
            </label>

            {/* Phần hiển thị ảnh */}
            <div className="w-full space-y-4">
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <button
                        type="button"
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition ${idx === currentImageIndex ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'}`}
                      >
                        <Image src={img.preview} alt="" fill className="object-cover" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="w-full rounded-lg bg-gray-100 overflow-hidden">
                <div 
                  ref={previewRef}
                  className="relative w-full"
                  style={{
                    aspectRatio: images[currentImageIndex] ? 'auto' : '16/9',
                  }}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onMouseLeave={handleCropMouseUp}
                >
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  <Image
                    src={images[currentImageIndex]?.preview ?? ""}
                    alt="Preview"
                    width={1200}
                    height={800}
                    className="w-full h-auto"
                    style={{
                      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                      transform: `rotate(${rotation}deg)`,
                      transition: 'transform 0.3s ease',
                      width: '100%',
                      height: 'auto',
                    }}
                    unoptimized
                  />
                
                {/* Khối cắt */}
                {isEditing && isCropping && (
                  <>
                    {/* Viền trắng không có nền đen */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div 
                        className="absolute bg-transparent border-2 border-white shadow-lg"
                        style={{
                          left: `${crop.x}%`,
                          top: `${crop.y}%`,
                          width: `${crop.width}%`,
                          height: `${crop.height}%`,
                        }}
                      />
                    </div>
                    
                    {/* Vùng kéo */}
                    <div
                      className="absolute cursor-move"
                      style={{
                        left: `${crop.x}%`,
                        top: `${crop.y}%`,
                        width: `${crop.width}%`,
                        height: `${crop.height}%`,
                      }}
                      onMouseDown={handleCropMouseDown}
                    >
                      {/* 4 góc để resize - lớn hơn và dễ kéo hơn */}
                      <div 
                        className="absolute -top-2 -left-2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleCornerMouseDown(e, 'nw')}
                      />
                      <div 
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleCornerMouseDown(e, 'ne')}
                      />
                      <div 
                        className="absolute -bottom-2 -left-2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleCornerMouseDown(e, 'sw')}
                      />
                      <div 
                        className="absolute -bottom-2 -right-2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleCornerMouseDown(e, 'se')}
                      />
                    </div>
                  </>
                )}
                </div>
              </div>
              
              {isEditing && (
                <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
                  {/* Xoay và Cắt ảnh */}
                  <div className="flex gap-2 pb-3 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={handleRotate}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Xoay
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const newIsCropping = !isCropping;
                        setIsCropping(newIsCropping);
                        updateCurrentImage({ isCropping: newIsCropping });
                      }}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition ${isCropping ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                      {isCropping ? 'Đang cắt ảnh' : 'Cắt ảnh'}
                    </button>
                    
                    {isCropping && (
                      <button
                        type="button"
                        onClick={async () => {
                          await confirmCrop();
                        }}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Xác nhận
                      </button>
                    )}
                    
                    <button
                      type="button"
                      onClick={resetToOriginal}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-orange-300 bg-orange-50 text-sm font-medium text-orange-700 hover:bg-orange-100"
                      title="Quay lại ảnh gốc"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Hoàn tác
                    </button>
                  </div>
                  
                  {/* Filters */}
                  <div>
                    <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>Độ sáng</span>
                      <span className="text-blue-600">{brightness}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={brightness}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        setBrightness(newValue);
                        updateCurrentImage({ brightness: newValue });
                        handleFilterChange();
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>Độ tương phản</span>
                      <span className="text-blue-600">{contrast}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={contrast}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        setContrast(newValue);
                        updateCurrentImage({ contrast: newValue });
                        handleFilterChange();
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                      <span>Độ bão hòa</span>
                      <span className="text-blue-600">{saturation}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={saturation}
                      onChange={(e) => {
                        const newValue = Number(e.target.value);
                        setSaturation(newValue);
                        updateCurrentImage({ saturation: newValue });
                        handleFilterChange();
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleUpload}
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Tải lên
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <input 
          id="file-upload" 
          type="file" 
          onChange={handleFileChange} 
          accept="image/*" 
          multiple
          className="hidden"
        />
      </div>
    </div>
  );
}
