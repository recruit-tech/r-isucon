package jp.co.recruit.riscon.service;

import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jp.co.recruit.riscon.entity.BelongsOrganizations;
import jp.co.recruit.riscon.entity.ReservableRooms;
import jp.co.recruit.riscon.entity.Reservation;
import jp.co.recruit.riscon.entity.Rooms;

@Service
@Transactional
public class ReservationsService {
    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<BelongsOrganizations> findBelongsOrganizations(String username){
        return entityManager.createNativeQuery("SELECT * FROM belongs_organizations WHERE username=?1",BelongsOrganizations.class)
                .setParameter(1, username)
                .getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<ReservableRooms> findReservableRooms(Integer organizationId){
        return entityManager.createNativeQuery("SELECT * FROM reservable_rooms WHERE organization_id=?1",ReservableRooms.class)
                .setParameter(1, organizationId)
                .getResultList();
    }

    public Rooms findRooms(Integer id){
        try {
            return (Rooms)entityManager.createNativeQuery("SELECT * FROM rooms WHERE id=?1",Rooms.class)
                    .setParameter(1, id)
                    .getSingleResult();
        }catch (Exception e) {
            return null;
        }
    }

    public Reservation findReservation(Integer id,String date,String start,String end){
        try {
            return (Reservation)entityManager.createNativeQuery("SELECT * FROM reservation WHERE room_id=?1 AND date=?2 AND ((CAST(?3 AS TIME) < end_time AND CAST(?4 AS TIME) > start_time))",Reservation.class)
                    .setParameter(1, id)
                    .setParameter(2, date)
                    .setParameter(3, start)
                    .setParameter(4, end)
                    .getSingleResult();
        }catch (Exception e) {
            return null;
        }

    }

    public void insertReservation(Integer id,String username,String title,String date,String start,String end) {
        entityManager.createNativeQuery("INSERT INTO reservation (room_id, username, title, date, start_time, end_time) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
        .setParameter(1, id)
        .setParameter(2, username)
        .setParameter(3, title)
        .setParameter(4, date)
        .setParameter(5, start)
        .setParameter(6, end)
        .executeUpdate();
    }

    public Reservation findReserved(Integer id){
        try {
            return (Reservation)entityManager.createNativeQuery("SELECT * FROM reservation WHERE id=?1",Reservation.class)
                    .setParameter(1, id)
                    .getSingleResult();
        }catch (Exception e) {
            return null;
        }

    }

    public Reservation checkAlreadyReservation(Integer roomId,String date,Integer reservationId,String start,String end){
        try {
            return (Reservation)entityManager.createNativeQuery("SELECT * FROM reservation WHERE room_id=?1 AND date=?2 AND id!=?3 AND (CAST(?4 AS TIME) < end_time AND CAST(?5 AS TIME) > start_time)"
                    ,Reservation.class)
                    .setParameter(1, roomId)
                    .setParameter(2, date)
                    .setParameter(3, reservationId)
                    .setParameter(4, start)
                    .setParameter(5, end)
                    .getSingleResult();
        }catch (Exception e) {
            return null;
        }

    }

    public void updateReservation(String date,String start,String end,String title,Integer roomId,Integer id) {
        entityManager.createNativeQuery("UPDATE reservation SET date=?1, start_time=?2, end_time=?3, title=?4, room_id=?5 WHERE id=?6")
            .setParameter(1, date)
            .setParameter(2, start)
            .setParameter(3, end)
            .setParameter(4, title)
            .setParameter(5, roomId)
            .setParameter(6, id)
            .executeUpdate();
    }
}
