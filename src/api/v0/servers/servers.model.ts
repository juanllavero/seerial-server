import { User } from "@/api/v0/index.models";
import {
  Column,
  DataType,
  HasMany,
  IsIn,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({ tableName: "Server", timestamps: false })
export class Server extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0],
    allowNull: false,
  })
  id!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  // HTTP port configuration
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 34200,
    field: "http_port",
  })
  httpPort!: number;

  // HTTPS port configuration
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 34400,
    field: "https_port",
  })
  httpsPort!: number;

  // Tunnel configuration
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "tunnel_enabled",
  })
  tunnelEnabled!: boolean;

  @Column({ type: DataType.STRING, allowNull: true, field: "tunnel_url" })
  tunnelUrl?: string;

  // HTTPS enablement and certificate configuration
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "https_enabled",
  })
  httpsEnabled!: boolean;

  @Column({ type: DataType.STRING, allowNull: true, field: "ssl_cert_path" })
  sslCertPath?: string;

  @Column({ type: DataType.STRING, allowNull: true, field: "ssl_key_path" })
  sslKeyPath?: string;

  @Column({ type: DataType.STRING, allowNull: true, field: "ssl_password" }) // Store securely in application logic (e.g., encrypted)
  sslPassword?: string;

  // Custom URL for access
  @Column({ type: DataType.STRING, allowNull: true, field: "custom_url" })
  customUrl?: string;

  // Proxy hosts for X-Forwarded-For
  @Column({ type: DataType.STRING, allowNull: true, field: "proxy_hosts" }) // Comma-separated list
  proxyHosts?: string;

  // Force HTTPS
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "force_https",
  })
  forceHttps!: boolean;

  // Remote access options
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: "allow_remote_connections",
  })
  allowRemoteConnections!: boolean;

  @Column({ type: DataType.STRING, allowNull: true, field: "remote_ip_filter" }) // Comma-separated IPs or IP/mask
  remoteIpFilter?: string;

  @IsIn([["whitelist", "blacklist"]])
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "whitelist",
    field: "remote_ip_filter_mode",
  })
  remoteIpFilterMode!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "enable_auto_port_mapping",
  })
  enableAutoPortMapping!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 34200,
    field: "public_http_port",
  })
  publicHttpPort!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 34400,
    field: "public_https_port",
  })
  publicHttpsPort!: number;

  // Associations
  @HasMany(() => User, {
    foreignKey: "serverId",
    onDelete: "CASCADE",
    hooks: true,
  })
  users!: User[];
}
