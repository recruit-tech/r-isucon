package jp.co.recruit.riscon.service;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * LogoutService
 * @author S.Hamaoka
 */
@Service
@Transactional
public class LogoutService {
    @PersistenceContext
    private EntityManager entityManager;

    public void deleteSession(String id) {
        entityManager.createNativeQuery("DELETE FROM session WHERE id=?1").setParameter(1, id).executeUpdate();
    }
}
