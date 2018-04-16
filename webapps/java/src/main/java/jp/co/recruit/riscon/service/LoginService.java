package jp.co.recruit.riscon.service;

import java.util.Date;
import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jp.co.recruit.riscon.entity.Users;

/**
 * LoginService
 * @author S.Hamaoka
 */
@Service
@Transactional
public class LoginService {
    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<Users> findUsers(String username) {
        return entityManager.createNativeQuery("SELECT * FROM users WHERE username=?1",Users.class).setParameter(1, username).getResultList();
    }

    public void deleteSession(String username) {
        entityManager.createNativeQuery("DELETE FROM session WHERE username=?1").setParameter(1, username).executeUpdate();
    }

    public void insertSession(String id,String username) {
        entityManager.createNativeQuery("INSERT INTO session (id, username, expired_at) VALUES (?1, ?2, ?3)")
        .setParameter(1, id)
        .setParameter(2, username)
        .setParameter(3, (int)(new Date().getTime()/ 1000 + 300))
        .executeUpdate();
    }
}
