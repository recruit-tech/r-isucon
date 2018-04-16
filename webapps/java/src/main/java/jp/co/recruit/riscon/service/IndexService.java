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
import jp.co.recruit.riscon.entity.Users;

@Service
@Transactional
public class IndexService {
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

    @SuppressWarnings("unchecked")
    public List<Reservation> findReservations(String date,Integer roomId){
        return entityManager.createNativeQuery("SELECT * FROM reservation WHERE date=?1 AND room_id=?2 ORDER BY start_time",Reservation.class)
                .setParameter(1, date)
                .setParameter(2, roomId)
                .getResultList();
    }

    public Users findUsers(String username) {
        return (Users)entityManager.createNativeQuery("SELECT * FROM users WHERE username=?1",Users.class).setParameter(1, username).getSingleResult();
    }
}
