import Image from "@/components/ui/Image";

interface LoginLayoutProps {
	children: React.ReactNode;
}

function LoginLayout({ children }: LoginLayoutProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-cyan-900 via-cyan-950 to-black">
			{/* Logo */}
			<div className="absolute top-5 left-5 w-40">
				<Image src="/img/banner.svg" alt="Logo" aspectRatio={"21/9"} />
			</div>

			<div className="w-full max-w-5xl px-8">{children}</div>
		</div>
	);
}

export default LoginLayout;
