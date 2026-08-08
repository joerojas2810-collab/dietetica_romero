'use client';

export default function CreditCardIcon() {
  return (
    <div className="relative h-[17px] w-[19px] rounded-[3px] border-2 border-current">
      <span className="absolute left-0 top-[3px] h-[2px] w-full bg-current" />
      <span className="absolute bottom-[3px] left-[3px] h-[2px] w-[5px] bg-current" />
    </div>
  );
}