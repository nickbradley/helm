import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Application extends BaseEntity {
  @PrimaryColumn("text")
  name!: string;

  @Column("text")
  icon: string = "";

  @Column("text")
  path: string = "";
}