import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm";

@Entity()
export class Window extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("text")
  appName: string = "";

  @Column("text")
  title: string = "";
}