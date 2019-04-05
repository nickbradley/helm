import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from "typeorm";

@Entity()
export class Window extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  icon: string;

  @Column("text")
  label: string;

  constructor() {
    super();
    this.id = 0;
    this.icon = "";
    this.label = "";
  }
}