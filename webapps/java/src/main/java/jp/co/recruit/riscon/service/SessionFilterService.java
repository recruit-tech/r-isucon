package jp.co.recruit.riscon.service;

import java.util.Date;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jp.co.recruit.riscon.entity.Session;
import jp.co.recruit.riscon.entity.Users;

@Service
@Transactional
public class SessionFilterService {
    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<Session> findSession(String id) {
        return entityManager.createNativeQuery("SELECT * FROM session WHERE id=?1",Session.class).setParameter(1, id).getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Users> findUsers(String username) {
        return entityManager.createNativeQuery("SELECT * FROM users WHERE username=?1",Users.class).setParameter(1, username).getResultList();
    }

    public void updateSession(String id) {
        entityManager.createNativeQuery("UPDATE session SET expired_at=?1 WHERE id=?2")
        .setParameter(1, (int)(new Date().getTime()/ 1000 + 300))
        .setParameter(2, id)
        .executeUpdate();
    }

    public void deleteSession(String id) {
        entityManager.createNativeQuery("DELETE FROM session WHERE id=?1").setParameter(1, id).executeUpdate();
    }
}
