import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ActiveProject extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("text")
  name!: string;

  @Column("datetime")
  start!: Date;

  @Column("datetime")
  end!: Date;
}