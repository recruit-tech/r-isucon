package jp.co.recruit.riscon.entity;

import java.io.Serializable;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Table;

import lombok.Data;

@Data
@Entity
@Table(name="reservable_rooms")
public class ReservableRooms implements Serializable{
    @Id
    @Embedded
    public RoomOrganizationId roomOrganizationId;

    @Embeddable
    @Data
    public static class RoomOrganizationId implements Serializable{
        @Column(name="room_id")
        public Integer roomId;
        @Column(name="organization_id")
        public String organizationId;
    }
}