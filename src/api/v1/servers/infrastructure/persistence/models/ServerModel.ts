import { defaults } from "@/data/defaults/ModelDefaults";
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
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
  })
  httpPort!: number;

  // HTTPS port configuration
  @Column({
    type: "integer",
    nullable: false,
    default: 34400,
  })
  httpsPort!: number;

  // Tunnel configuration
  @Column({
    type: "boolean",
    nullable: false,
    default: false,
  })
  tunnelEnabled!: boolean;

  @Column({ type: "varchar", nullable: true })
  tunnelUrl?: string;

  // HTTPS enablement and certificate configuration
  @Column({
    type: "boolean",
    nullable: false,
    default: false,
  })
  httpsEnabled!: boolean;

  @Column({ type: "varchar", nullable: true })
  sslCertPath?: string;

  @Column({ type: "varchar", nullable: true })
  sslKeyPath?: string;

  @Column({ type: "varchar", nullable: true }) // Store securely in application logic (e.g., encrypted)
  sslPassword?: string;

  // Custom URL for access
  @Column({ type: "varchar", nullable: true })
  customUrl?: string;

  // Proxy hosts for X-Forwarded-For
  @Column({ type: "varchar", nullable: true }) // Comma-separated list
  proxyHosts?: string;

  // Force HTTPS
  @Column({
    type: "boolean",
    nullable: false,
    default: false,
  })
  forceHttps!: boolean;

  // Remote access options
  @Column({
    type: "boolean",
    nullable: false,
    default: true,
  })
  allowRemoteConnections!: boolean;

  @Column({ type: "varchar", nullable: true }) // Comma-separated IPs or IP/mask
  remoteIpFilter?: string;

  @Column({
    type: "varchar",
    nullable: false,
    default: "whitelist",
  })
  remoteIpFilterMode!: string;

  @Column({
    type: "boolean",
    nullable: false,
    default: false,
  })
  enableAutoPortMapping!: boolean;

  @Column({
    type: "integer",
    nullable: false,
    default: 34200,
  })
  publicHttpPort!: number;

  @Column({
    type: "integer",
    nullable: false,
    default: 34400,
  })
  publicHttpsPort!: number;

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
