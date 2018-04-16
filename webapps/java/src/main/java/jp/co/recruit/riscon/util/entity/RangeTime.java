package jp.co.recruit.riscon.util.entity;

import java.io.Serializable;

public class RangeTime  implements Serializable{
    public String startTime="";
    public String endTime="";
    public int colspan=0;
    public ExtendsReservation extendsReservation=null;

    public RangeTime(String startTime,String endTime,int colspan,ExtendsReservation extendsReservation) {
        this.startTime =startTime;
        this.endTime = endTime;
        this.colspan = colspan;
        this.extendsReservation = extendsReservation;
    }

    public RangeTime() {

    }

    @Override
    public RangeTime clone(){
        RangeTime rangeTime = new RangeTime();
        rangeTime.startTime= new String(this.startTime);
        rangeTime.endTime = new String(this.endTime);
        rangeTime.colspan = new Integer(this.colspan);
        if(this.extendsReservation==null) {
            rangeTime.extendsReservation = null;
        }else {
            rangeTime.extendsReservation = this.extendsReservation.clone();
        }
        return rangeTime;
    }
}
