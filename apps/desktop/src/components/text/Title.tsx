import type React from "react";
import { memo } from "react";

interface AppTextProps {
	className?: string;
	style?: React.CSSProperties;
	children: React.ReactNode;
}

const Title = ({ className, style, children, ...props }: AppTextProps) => {
	return (
		<span
			className={`${className} font-black text-[6vh] text-white`}
			style={style}
			{...props}
		>
			{children}
		</span>
	);
};

export default memo(Title);
