import Image from 'next/image';

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
            <div className="relative">
                {/* Animated outer ring */}
                <div className="absolute inset-[-20px] rounded-full border-t-4 border-primary animate-spin opacity-20"></div>
                <div className="absolute inset-[-20px] rounded-full border-r-4 border-primary animate-spin-slow opacity-10"></div>

                {/* Logo Container */}
                <div className="relative flex items-center justify-center p-8 bg-white rounded-2xl shadow-2xl animate-pulse">
                    <Image
                        src="https://estate-4u.com/wp-content/uploads/2024/06/Logo-2.png"
                        alt="EstateforYou Logo"
                        width={240}
                        height={80}
                        priority
                        className="w-auto h-16 object-contain"
                    />
                </div>
            </div>

            {/* Loading Text */}
            <div className="mt-12 flex flex-col items-center gap-3">
                <div className="text-[#0C1536] font-bold text-xl tracking-wider uppercase">
                    Welcome to <span className="text-[#4C7DFF]">EstateforYou</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#4C7DFF] animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#4C7DFF] animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#4C7DFF] animate-bounce"></div>
                </div>
            </div>
        </div>
    );
}
