import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Usage extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("datetime")
  created: Date = new Date();

  @Column("text")
  kind: string = "";

  @Column("text")
  action: string = "";

  @Column("text")
  resource: string = "";
}