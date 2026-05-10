// ---- User ----
export interface IUser {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Sources ----
export interface ISource {
  id: string;
  userId: string;
  name: string;
  url: string;
  isActive: boolean;
  isOnline: boolean | null;
  lastCheckedAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateSourceDto {
  name: string;
  url: string;
  note?: string;
}

export interface IUpdateSourceDto {
  name?: string;
  url?: string;
  isActive?: boolean;
  note?: string;
}

// ---- Configs ----
export interface IConfig {
  id: string;
  userId: string;
  templateName: string;
  customRules: string | null;
  targetType: ConfigTargetType;
  createdAt: string;
  updatedAt: string;
}

export type ConfigTargetType = "clash" | "surge" | "quantumultx" | "stash";

export interface ICreateConfigDto {
  templateName: string;
  customRules?: string;
  targetType: ConfigTargetType;
}

export interface IUpdateConfigDto {
  templateName?: string;
  customRules?: string;
  targetType?: ConfigTargetType;
}

// ---- Vault ----
export interface IVault {
  id: string;
  userId: string;
  contentUrl: string;
  tags: string | null;
  expiryDate: string | null;
  createdAt: string;
}

export interface ICreateVaultDto {
  contentUrl: string;
  tags?: string;
  expiryDate?: string;
}

// ---- Auth ----
export interface ILoginDto {
  username: string;
  password: string;
}

export interface IRegisterDto {
  username: string;
  password: string;
}

export interface IUpdatePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface ITokenResponse {
  accessToken: string;
  user: IUser;
}

// ---- API ----
export interface IApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface IPaginatedResponse<T> {
  items: T[];
  total: number;
}
