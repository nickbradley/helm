import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tracker } from "./Tracker";

@Entity()
export class Shell extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("text")
  session: string = "";

  @Column("int")
  cmdNo: number = 0;

  @Column("text")
  cmdStr: string = "";

  @Column("text")
  cwd: string = "";

  @Column("int")
  code: number = -1;

  @ManyToOne(type => Tracker, tracker => tracker.shells)
  tracker!: Tracker;
}
