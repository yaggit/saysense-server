import { Request } from 'express';
import { User } from '../../common/entities/user.entity';

export interface RequestWithUser extends Request {
  user: User;
}
