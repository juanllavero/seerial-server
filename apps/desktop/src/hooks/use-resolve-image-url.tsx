import { useGetLocalImage } from "@seerial/api";
import { useServerStore } from "@seerial/stores";
import { useEffect, useState } from "react";

export const useResolveImageUrl = (url?: string, isInView: boolean = true) => {
	const serverUrl = useServerStore((state) => state.selectedServer?.url ?? "");

	const isRemoteUrl = !!url?.startsWith("http");
	const localImagePath = url && !isRemoteUrl ? url : undefined;

	// Initialize with the URL if it's remote, otherwise undefined until we get the blob
	const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(
		isRemoteUrl ? url : undefined,
	);

	const { data: localImageBlob, error: localImageError } = useGetLocalImage({
		enabled: isInView && !!localImagePath && !!serverUrl,
		params: localImagePath ? { path: localImagePath } : undefined,
		queryKey: ["images", "local", serverUrl, localImagePath],
	});

	useEffect(() => {
		// If the URL is remote or there is no URL, update and exit
		if (isRemoteUrl || !url) {
			setResolvedUrl(isRemoteUrl ? url : undefined);
			return;
		}

		// If the URL is local but we don't have the blob yet, clear the URL
		if (!localImageBlob) {
			setResolvedUrl(undefined);
			return;
		}

		// Create the URL from the blob
		const objectUrl = URL.createObjectURL(localImageBlob);
		setResolvedUrl(objectUrl);

		// Clean up the memory when the component unmounts or the blob changes
		return () => {
			URL.revokeObjectURL(objectUrl);
		};
	}, [localImageBlob, isRemoteUrl, url]);

	return {
		resolvedUrl,
		localImageError,
		isLocalImage: !isRemoteUrl && !!url,
	};
};
