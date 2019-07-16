import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Application extends BaseEntity {
  @PrimaryColumn("text")
  identifier: string = "";

  @Column("text")
  name!: string;

  @Column("text")
  icon: string = "";

  @Column("text")
  path: string = "";

  toString(): string {
    return JSON.stringify({
      identifier: this.identifier,
      name: this.name,
      icon: `${this.icon.slice(0, 20)}...`,
      path: this.path,
    })
  }
}