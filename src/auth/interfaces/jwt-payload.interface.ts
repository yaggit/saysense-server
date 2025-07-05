export interface JwtPayload {
  sub: string; // user ID
  name: string;
  role: string;
  isGuest: boolean;
}
