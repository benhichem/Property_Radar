import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class List {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  state: string

  @Column()
  status: string

  @Column()
  item_count: number
}
