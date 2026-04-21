import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { memo } from "react";

function ChevronIndicator() {
	return (
		<motion.div
			className="fixed right-0 top-1/2 z-50 -translate-y-1/2 pointer-events-none"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3 }}
		>
			<div className="flex items-center justify-center rounded-l-full bg-white/10 px-1 py-6 backdrop-blur-sm">
				<ChevronRight size="3dvh" className="text-white/60" />
			</div>
		</motion.div>
	);
}

export default memo(ChevronIndicator);
