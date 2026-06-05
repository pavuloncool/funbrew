'use client';

import { useMemo } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';

import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';

import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize, FilePondPluginImagePreview);

type CoffeeLabelUploadFieldProps = {
  file?: File;
  onFileChange: (file?: File) => void;
  labelIdle?: string;
  className?: string;
  testId?: string;
  acceptedFileTypes?: string[];
  disabled?: boolean;
};

export function CoffeeLabelUploadField(props: CoffeeLabelUploadFieldProps) {
  const { file, onFileChange, labelIdle, className, testId, acceptedFileTypes, disabled } = props;
  const files = useMemo(() => (file instanceof File ? [file] : []), [file]);

  return (
    <div className={className} data-testid={testId}>
      <FilePond
        files={files}
        allowMultiple={false}
        maxFiles={1}
        instantUpload={false}
        credits={false}
        disabled={disabled}
        allowImagePreview
        acceptedFileTypes={acceptedFileTypes ?? ['image/jpeg', 'image/png', 'image/webp']}
        maxFileSize="512KB"
        labelIdle={
          labelIdle ?? 'Przeciągnij obraz lub <span class="filepond--label-action">wybierz</span>'
        }
        onupdatefiles={(items) => {
          const next = items[0]?.file;
          onFileChange(next instanceof File ? next : undefined);
        }}
      />
    </div>
  );
}
