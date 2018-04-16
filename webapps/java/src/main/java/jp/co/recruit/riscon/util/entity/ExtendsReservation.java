package jp.co.recruit.riscon.util.entity;

import java.sql.Date;
import java.sql.Time;

import jp.co.recruit.riscon.entity.Reservation;
import jp.co.recruit.riscon.entity.Users;

public class ExtendsReservation extends Reservation{
    public Users users=null;

    public ExtendsReservation() {
    }

    public ExtendsReservation(Reservation reservation,Users users) {
        this.id = reservation.id;
        this.roomId = reservation.roomId;
        this.username = reservation.username;
        this.title = reservation.title;
        this.date = reservation.date;
        this.startTime = reservation.startTime;
        this.endTime = reservation.endTime;
        if(users!=null) {
            this.users = users.clone();
        }
        else {
            this.users = null;
        }
    }

    @Override
    public ExtendsReservation clone(){
        ExtendsReservation extendsReservation = new ExtendsReservation();
        extendsReservation.id= new Integer(this.id);
        extendsReservation.roomId =  new Integer(this.roomId);
        extendsReservation.username = new String(this.username);
        extendsReservation.title = new String(this.title);
        extendsReservation.date = (Date) this.date.clone();
        extendsReservation.startTime = (Time)this.startTime.clone();
        extendsReservation.endTime = (Time)this.endTime.clone();
        extendsReservation.users = this.users.clone();
        return extendsReservation;
    }
}
