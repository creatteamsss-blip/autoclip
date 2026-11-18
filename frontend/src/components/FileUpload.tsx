import React, { useState } from 'react';
import { Upload, Button, Input, Typography, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { projectApi } from '../../services/api';

const { Dragger } = Upload;
const { Text } = Typography;

interface FileUploadProps {
  onUploadSuccess: () => void;
}

interface Category {
  value: string;
  label: string;
  color: string;
}

const categories: Category[] = [
  { value: 'tech', label: '科技', color: '#4facfe' },
  { value: 'lifestyle', label: '生活', color: '#00f2fe' },
  { value: 'business', label: '商业', color: '#43e97b' },
];

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [files, setFiles] = useState<{ video?: File; srt?: File }>({});
  const [projectName, setProjectName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('tech');
  const [uploading, setUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleUpload = async () => {
    if (!files.video) {
      message.error('请选择视频文件');
      return;
    }
    if (!files.srt) {
      message.error('请同时导入字幕文件(.srt)');
      return;
    }
    if (!projectName.trim()) {
      message.error('请输入项目名称');
      return;
    }

    try {
      setUploading(true);
      message.info('正在上传视频到 Vercel Blob...');

      const { upload } = await import('@vercel/blob/client');
      const newBlob = await upload(files.video.name, files.video, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });

      const videoUrl = newBlob.url;
      message.info('视频上传成功，正在处理后端...');

      await projectApi.createProject({
        name: projectName,
        category: selectedCategory,
        video_url: videoUrl,
        srt_file: files.srt,
      });

      message.success('项目创建成功！');
      onUploadSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
      message.error(`上传失败: ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: 'rgba(20, 20, 20, 0.9)', borderRadius: '16px' }}>
      <Dragger
        name="file"
        multiple={true}
        beforeUpload={(file) => {
          if (file.type.includes('video') || file.name.endsWith('.mp4') || file.name.endsWith('.mov')) {
            setFiles((prev) => ({ ...prev, video: file }));
            if (!projectName) {
              setProjectName(file.name.replace(/\.[^/.]+$/, ''));
            }
          } else if (file.name.endsWith('.srt')) {
            setFiles((prev) => ({ ...prev, srt: file }));
          }
          return false;
        }}
        onDrop={() => setIsDragActive(false)}
        style={{ background: 'rgba(30, 30, 30, 0.6)', border: '2px dashed rgba(79, 172, 254, 0.4)' }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: '#4facfe', fontSize: '48px' }} />
        </p>
        <p className="ant-upload-text">
          <Text strong style={{ color: '#ffffff', fontSize: '16px' }}>
            {isDragActive ? '松开鼠标导入文件' : '点击或拖拽文件到此区域'}
          </Text>
        </p>
        <p className="ant-upload-hint">
          <Text style={{ color: '#cccccc', fontSize: '14px' }}>
            支持 MP4、MOV 等格式，<Text style={{ color: '#ff9500', fontWeight: 600 }}>必须同时导入字幕文件(.srt)</Text>
          </Text>
        </p>
      </Dragger>

      {files.video && (
        <div style={{ marginTop: '16px' }}>
          <Text strong style={{ color: '#ffffff', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
            项目名称
          </Text>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="请输入项目名称"
            style={{ height: '40px', borderRadius: '8px', background: 'rgba(38, 38, 38, 0.8)', color: '#ffffff' }}
          />
        </div>
      )}

      {files.video && (
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
          <Text strong style={{ color: '#ffffff', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
            视频分类
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {categories.map((category) => {
              const isSelected = selectedCategory === category.value;
              return (
                <div
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${category.color}` : '2px solid rgba(255, 255, 255, 0.1)',
                    background: isSelected ? `${category.color}25` : 'transparent',
                    color: '#ffffff',
                  }}
                >
                  {category.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {files.video && files.srt && (
        <Button
          type="primary"
          loading={uploading}
          onClick={handleUpload}
          style={{ width: '100%', height: '44px', borderRadius: '8px', background: '#4facfe', fontWeight: 'bold' }}
        >
          {uploading ? '正在上传...' : '开始处理项目'}
        </Button>
      )}
    </div>
  );
}
