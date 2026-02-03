import { UserModel } from "@/api/v1/users/infrastructure/persistence/models/UserModel";
import { defaults } from "@/data/defaults/ModelDefaults";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({ name: "Server" })
export class ServerModel extends BaseEntity {
  @PrimaryColumn({ type: "varchar", nullable: false })
  id!: string;

  @Column({ type: "varchar", nullable: false })
  name!: string;

  // HTTP port configuration
  @Column({
    type: "integer",
    nullable: false,
    default: 34200,
    name: "http_port",
  })
  httpPort!: number;

  // HTTPS port configuration
  @Column({
    type: "integer",
    nullable: false,
    default: 34400,
    name: "https_port",
  })
  httpsPort!: number;

  // Tunnel configuration
  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "tunnel_enabled",
  })
  tunnelEnabled!: boolean;

  @Column({ type: "varchar", nullable: true, name: "tunnel_url" })
  tunnelUrl?: string;

  // HTTPS enablement and certificate configuration
  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "https_enabled",
  })
  httpsEnabled!: boolean;

  @Column({ type: "varchar", nullable: true, name: "ssl_cert_path" })
  sslCertPath?: string;

  @Column({ type: "varchar", nullable: true, name: "ssl_key_path" })
  sslKeyPath?: string;

  @Column({ type: "varchar", nullable: true, name: "ssl_password" }) // Store securely in application logic (e.g., encrypted)
  sslPassword?: string;

  // Custom URL for access
  @Column({ type: "varchar", nullable: true, name: "custom_url" })
  customUrl?: string;

  // Proxy hosts for X-Forwarded-For
  @Column({ type: "varchar", nullable: true, name: "proxy_hosts" }) // Comma-separated list
  proxyHosts?: string;

  // Force HTTPS
  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "force_https",
  })
  forceHttps!: boolean;

  // Remote access options
  @Column({
    type: "boolean",
    nullable: false,
    default: true,
    name: "allow_remote_connections",
  })
  allowRemoteConnections!: boolean;

  @Column({ type: "varchar", nullable: true, name: "remote_ip_filter" }) // Comma-separated IPs or IP/mask
  remoteIpFilter?: string;

  @Column({
    type: "varchar",
    nullable: false,
    default: "whitelist",
    name: "remote_ip_filter_mode",
  })
  remoteIpFilterMode!: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
    name: "enable_auto_port_mapping",
  })
  enableAutoPortMapping!: boolean;

  @Column({
    type: "integer",
    nullable: false,
    default: 34200,
    name: "public_http_port",
  })
  publicHttpPort!: number;

  @Column({
    type: "integer",
    nullable: false,
    default: 34400,
    name: "public_https_port",
  })
  publicHttpsPort!: number;

  // Associations
  @OneToMany(() => UserModel, (user) => user.server)
  users!: UserModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split("-")[0];
    }
  }

  static createWithDefaults(data: Partial<ServerModel>) {
    return ServerModel.create({
      ...defaults.ServerModel,
      ...data,
    });
  }
}
