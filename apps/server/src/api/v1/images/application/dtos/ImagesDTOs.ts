export interface ImageUploadDTO {
	destPath: string;
	image?: Express.Multer.File;
}
