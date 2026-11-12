/** 1–5 rating as dots (44px tap targets); dots up to the value are filled. */
export function RatingDots({ name, value, filledClassName, onChange }: {
  name: string
  value: number
  filledClassName: string
  onChange: (value: number) => void
}) {
  return (
    <div role="radiogroup" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <label key={rating} className="flex size-11 cursor-pointer items-center justify-center">
          <input
            type="radio"
            name={name}
            value={rating}
            checked={value === rating}
            onChange={() => onChange(rating)}
            className="peer sr-only"
          />
          <span
            className={`size-7 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-uc-primary ${
              rating <= value ? filledClassName : 'bg-uc-skeleton'
            } ${value === rating ? 'ring-2 ring-uc-text ring-offset-2 ring-offset-uc-elevated' : ''}`}
          />
        </label>
      ))}
    </div>
  )
}
