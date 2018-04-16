package jp.co.recruit.riscon.service;

import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jp.co.recruit.riscon.entity.Organizations;
import jp.co.recruit.riscon.entity.Users;

@Service
@Transactional
public class RegisterService {
    @PersistenceContext
    private EntityManager entityManager;

    @SuppressWarnings("unchecked")
    public List<Organizations> findOrganizations(){
        return entityManager.createNativeQuery("SELECT * from organizations",Organizations.class).getResultList();
    }

    @SuppressWarnings("unchecked")
    public List<Users> findUsers(String username) {
        return entityManager.createNativeQuery("SELECT * FROM users WHERE username=?1",Users.class).setParameter(1, username).getResultList();
    }

    public void insertOrganization(String[] organizations,String username) {
        for(String organization:organizations) {
            entityManager.createNativeQuery("INSERT INTO belongs_organizations (organization_id, username) VALUES (?1, ?2)")
            .setParameter(1, organization)
            .setParameter(2, username).executeUpdate();
        }
    }

    public void insertUser(String username,String salt,String hash,String lastName,String firstName,String icon) {
        entityManager.createNativeQuery("INSERT INTO users (username, salt, hash, last_name, first_name, icon) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
        .setParameter(1, username)
        .setParameter(2, salt)
        .setParameter(3, hash)
        .setParameter(4, lastName)
        .setParameter(5, firstName)
        .setParameter(6, icon)
        .executeUpdate();
    }

    public void insertSession(String sessionId,String username,Integer expiredAt) {
        entityManager.createNativeQuery("INSERT INTO session (id, username, expired_at) VALUES (?1, ?2, ?3)")
        .setParameter(1, sessionId)
        .setParameter(2, username)
        .setParameter(3, expiredAt)
        .executeUpdate();
    }
}
