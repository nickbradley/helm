import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tracker } from "./Tracker";

@Entity()
export class Editor extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("text")
  file: string = "";

  @Column("text")
  project: string = "";

  @Column("text")
  language: string = "";

  @ManyToOne(type => Tracker, tracker => tracker.editors)
  tracker!: Tracker;
}