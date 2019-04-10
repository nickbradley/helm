import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tracker } from "./Tracker";

@Entity()
export class Interaction extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("boolean")
  afk: boolean = false;

  @ManyToOne(type => Tracker, tracker => tracker.interactions)
  tracker!: Tracker;
}