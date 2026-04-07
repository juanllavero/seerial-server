import { ImagesController } from '@/api/v1/images/infrastructure/web/controllers/ImagesController';
import { messages } from '@/config/messages';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    fileSystemService: {
        createFolder: jest.fn(),
        writeImage: jest.fn(),
        getExternalPath: jest.fn((p: string) => `/external/${p}`),
        join: jest.fn((...parts: string[]) => parts.join('/')),
    },
    imageProcessingService: {
        getDirectoryListing: jest.fn(),
        streamLocalImage: jest.fn(),
        streamRemoteImage: jest.fn(),
        getImageColorPalette: jest.fn(),
        createTransparentImage: jest.fn(),
    },
}));

jest.mock('@/api/v1/shared/infrastructure/services/SanitizationService', () => ({
    getSystemAllowedPaths: jest.fn(() => ['/']),
    isValidFileName: jest.fn(() => true),
    safeJoinPath: jest.fn((a: string, b: string) => `${a}/${b}`),
    sanitizeDirectoryPath: jest.fn((p: string) => p),
    sanitizeImagePath: jest.fn((p: string) => p),
}));

const container = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');
const sanitization = jest.requireMock('@/api/v1/shared/infrastructure/services/SanitizationService');

describe('ImagesController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        container.imageProcessingService.getDirectoryListing.mockResolvedValue([{ name: 'a.jpg' }]);
        container.imageProcessingService.getImageColorPalette.mockResolvedValue({ primary: '#000000' });
        container.imageProcessingService.createTransparentImage.mockResolvedValue(Buffer.from('png'));
    });

    it('uploads an image to a sanitized destination', async () => {
        const controller = new ImagesController();
        const image = {
            originalname: 'cover.jpg',
            buffer: Buffer.from('data'),
        };

        const response = await controller.uploadImage('/tmp/uploads', image as never);

        expect(container.fileSystemService.createFolder).toHaveBeenCalled();
        expect(container.fileSystemService.writeImage).toHaveBeenCalledWith('/tmp/uploads/cover.jpg', image.buffer);
        expect(response.message).toBe(messages.success.upload);
    });

    it('rejects upload when file name is invalid', async () => {
        sanitization.isValidFileName.mockReturnValue(false);

        await expect(
            new ImagesController().uploadImage('/tmp/uploads', {
                originalname: '../bad.jpg',
                buffer: Buffer.from('data'),
            } as never),
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('returns directory listing for sanitized path', async () => {
        const response = await new ImagesController().getDirectoryListing('/media%2Fposters');

        expect(container.imageProcessingService.getDirectoryListing).toHaveBeenCalledWith('/media/posters');
        expect(response.success).toBe(true);
    });

    it('streams local image with normalized dimensions', async () => {
        const response = {};
        const request = { res: response };

        await new ImagesController().getLocalImage('resources/img/poster.jpg', 320.9, 180.2, request as never);

        expect(container.imageProcessingService.streamLocalImage).toHaveBeenCalledWith(
            expect.objectContaining({
                filePath: '/external/resources/img/poster.jpg',
                res: response,
                width: 320,
                height: 180,
            }),
        );
    });

    it('streams remote image with optional dimensions', async () => {
        const response = {};
        const request = { res: response };

        await new ImagesController().getRemoteImage('https://example.com/img.jpg', 640, 360, request as never);

        expect(container.imageProcessingService.streamRemoteImage).toHaveBeenCalledWith({
            url: 'https://example.com/img.jpg',
            res: response,
            width: 640,
            height: 360,
        });
    });

    it('gets color palette from local path and default options', async () => {
        const response = await new ImagesController().getImageColorPalette(undefined, 'img/poster.jpg');

        expect(container.imageProcessingService.getImageColorPalette).toHaveBeenCalledWith(
            '/external/resources/img/poster.jpg',
            {
                targetLightness: { min: 0.04, max: 0.09 },
                saturationFactor: 1,
            },
        );
        expect(response.success).toBe(true);
    });

    it('rejects palette request without url or local path', async () => {
        await expect(new ImagesController().getImageColorPalette()).rejects.toMatchObject({ statusCode: 400 });
    });

    it('creates transparent image and sets png content type', async () => {
        const controller = new ImagesController();
        const setHeaderSpy = jest.spyOn(controller, 'setHeader');

        const result = await controller.createTransparentImage(300, 200, 'https://example.com/img.jpg');

        expect(container.imageProcessingService.createTransparentImage).toHaveBeenCalledWith(
            'https://example.com/img.jpg',
            300,
            200,
        );
        expect(setHeaderSpy).toHaveBeenCalledWith('Content-Type', 'image/png');
        expect(result).toBeInstanceOf(Buffer);
    });

    it('rejects transparent image creation when required params are missing', async () => {
        await expect(new ImagesController().createTransparentImage(0, 200, 'https://example.com/img.jpg')).rejects.toMatchObject({ statusCode: 400 });
    });
});
