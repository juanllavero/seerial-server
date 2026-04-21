import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "@/components/ui/Image";

interface HomeHeroImageProps {
	imageSrc?: string;
}

function HomeHeroImage({ imageSrc }: HomeHeroImageProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<div className="pointer-events-none absolute top-0 right-0 z-0 h-[70vh] w-[70vw] overflow-hidden">
			<AnimatePresence mode="sync" initial={false}>
				{imageSrc ? (
					<motion.div
						key={imageSrc}
						className="absolute inset-0"
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.7 }}
						exit={{ opacity: 0 }}
						transition={{
							duration: prefersReducedMotion ? 0.05 : 0.35,
							ease: "easeOut",
						}}
						style={{ willChange: "opacity" }}
					>
						<Image
							url={imageSrc}
							height="70vh"
							width="70vw"
							aspectRatio="2/3"
							style={{
								maskImage: `
      linear-gradient(to right, transparent 0%, black 80%),
      linear-gradient(to top,   transparent 0%, black 80%)
    `,
								maskComposite: "intersect",
								WebkitMaskImage: `
      linear-gradient(to right, transparent 0%, black 80%),
      linear-gradient(to top,   transparent 0%, black 80%)
    `,
								WebkitMaskComposite: "source-in",
							}}
						/>
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	);
}

export default HomeHeroImage;
