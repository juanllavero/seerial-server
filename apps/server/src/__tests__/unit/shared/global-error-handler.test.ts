const mockAppLoggerError = jest.fn();

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: {
    child: jest.fn(() => ({
      error: mockAppLoggerError,
    })),
  },
}));

import { ValidateError } from 'tsoa';
import { HTTPCodes } from '@/api/v1/shared/domain/types/HTTPCodes';
import { globalErrorHandler } from '@/api/v1/shared/infrastructure/web/exceptions/GlobalErrorHandler';
import { BadRequestException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';

function buildResponse() {
  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };

  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response;
}

describe('globalErrorHandler', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  it('formats ValidateError responses with status 422', () => {
    const response = buildResponse();
    const fields = {
      title: {
        message: 'Required',
        value: undefined,
      },
    };

    globalErrorHandler(
      new ValidateError(fields, 'Validation Failed'),
      {
        requestId: 'req-1',
        method: 'POST',
        originalUrl: '/api/collections',
        ip: '127.0.0.1',
      } as never,
      response as never,
      jest.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(HTTPCodes.VALIDATION_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation Failed',
        data: fields,
      }),
    );
  });

  it('formats HttpException responses with their explicit status and errors', () => {
    const response = buildResponse();
    const error = new BadRequestException('Invalid payload', {
      field: 'title',
    });

    globalErrorHandler(
      error,
      {
        requestId: 'req-2',
        method: 'PATCH',
        originalUrl: '/api/collections/1',
        user: { id: 'user-1' },
        ip: '127.0.0.1',
      } as never,
      response as never,
      jest.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(HTTPCodes.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Invalid payload',
        data: { field: 'title' },
      }),
    );
    expect(mockAppLoggerError).toHaveBeenCalled();
  });

  it('hides raw server errors in production', () => {
    const response = buildResponse();
    process.env.NODE_ENV = 'production';

    globalErrorHandler(
      new Error('SQLITE_BUSY'),
      {
        requestId: 'req-3',
        method: 'GET',
        originalUrl: '/api/health',
        ip: '127.0.0.1',
      } as never,
      response as never,
      jest.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(HTTPCodes.SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: messages.errors.server.internal,
      }),
    );
  });

  it('formats non-Error values as unknown failures', () => {
    const response = buildResponse();

    globalErrorHandler(
      'plain-string-error',
      {
        requestId: 'req-4',
        method: 'GET',
        originalUrl: '/api/health',
        ip: '127.0.0.1',
      } as never,
      response as never,
      jest.fn(),
    );

    expect(response.status).toHaveBeenCalledWith(HTTPCodes.SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Unknown error occurred',
        data: null,
      }),
    );
  });
});
