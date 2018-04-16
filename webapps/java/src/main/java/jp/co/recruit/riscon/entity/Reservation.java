package jp.co.recruit.riscon.entity;

import java.io.Serializable;
import java.sql.Date;
import java.sql.Time;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import lombok.Data;

@Data
@Entity
@Table(name="reservation")
public class Reservation implements Serializable{
    @Id
    @Column(name="id")
    public Integer id;

    @Column(name="room_id")
    public Integer roomId;

    @Column(name="username")
    public String username;

    @Column(name="title")
    public String title;

    @Column(name="date")
    public Date date;

    @Column(name="start_time")
    public Time startTime;

    @Column(name="end_time")
    public Time endTime;

    @Override
    public Reservation clone(){
        Reservation reservation = new Reservation();
        reservation.id= new Integer(this.id);
        reservation.roomId =  new Integer(this.roomId);
        reservation.username = new String(this.username);
        reservation.title = new String(this.title);
        reservation.date = (Date) this.date.clone();
        reservation.startTime = (Time)this.startTime.clone();
        reservation.endTime = (Time)this.endTime.clone();
        return reservation;
    }
}