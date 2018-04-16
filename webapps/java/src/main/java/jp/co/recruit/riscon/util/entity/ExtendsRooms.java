package jp.co.recruit.riscon.util.entity;

import java.util.ArrayList;
import java.util.List;

import jp.co.recruit.riscon.entity.Rooms;

public class ExtendsRooms extends Rooms{

    public ExtendsRooms(Rooms rooms, List<RangeTime> times) {
        this.id = rooms.id;
        this.name = rooms.name;
        this.location = rooms.location;
        for(RangeTime rangeTime : times) {
            this.rangeTime.add(rangeTime.clone());
        }
    }

    public List<RangeTime> rangeTime=new ArrayList<>();
}
