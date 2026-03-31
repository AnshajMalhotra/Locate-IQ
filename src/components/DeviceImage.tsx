import { useMemo, useState } from 'react';

import { Device, getDeviceImageCandidates } from '../data/mockDevices';

interface DeviceImageProps {
  device: Device;
  alt?: string;
  className?: string;
  imgClassName?: string;
}

function DeviceImage({
  device,
  alt,
  className = '',
  imgClassName = '',
}: DeviceImageProps) {
  const candidates = useMemo(() => getDeviceImageCandidates(device), [device]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  const safeIndex = Math.min(candidateIndex, Math.max(candidates.length - 1, 0));
  const src = candidates[safeIndex];

  return (
    <div className={`overflow-hidden rounded-[24px] border border-slate-800 bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_68%)] ${className}`.trim()}>
      <img
        src={src}
        alt={alt ?? `${device.title} product image`}
        className={`h-full w-full object-contain p-5 ${imgClassName}`.trim()}
        loading="lazy"
        onError={() => {
          setCandidateIndex((current) => (current < candidates.length - 1 ? current + 1 : current));
        }}
      />
    </div>
  );
}

export default DeviceImage;
