import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@/shared/constants/error-codes.enum';

export class BusinessException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ errorCode, message }, status);
  }
}

export class NotFoundException extends BusinessException {
  constructor(errorCode: ErrorCode, message: string) {
    super(errorCode, message, HttpStatus.NOT_FOUND);
  }
}

export class BadRequestException extends BusinessException {
  constructor(errorCode: ErrorCode, message: string) {
    super(errorCode, message, HttpStatus.BAD_REQUEST);
  }
}

export class ConflictException extends BusinessException {
  constructor(errorCode: ErrorCode, message: string) {
    super(errorCode, message, HttpStatus.CONFLICT);
  }
}

export class ForbiddenException extends BusinessException {
  constructor(errorCode: ErrorCode, message: string) {
    super(errorCode, message, HttpStatus.FORBIDDEN);
  }
}

export class UnauthorizedException extends BusinessException {
  constructor(errorCode: ErrorCode, message: string) {
    super(errorCode, message, HttpStatus.UNAUTHORIZED);
  }
}

export class UnprocessableException extends BusinessException {
  constructor(errorCode: ErrorCode, message: string) {
    super(errorCode, message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
