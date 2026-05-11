'use client';
interface Props {
  value: number;
  onChange?: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };

export default function StarRating({ value, onChange, size = 'md', readonly = false }: Props) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${sizes[size]} leading-none transition-opacity ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95 transition-transform'
          } ${value >= star ? 'opacity-100' : 'opacity-20'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
