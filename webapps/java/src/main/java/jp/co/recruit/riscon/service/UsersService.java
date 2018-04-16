package jp.co.recruit.riscon.service;

import java.util.List;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.NoResultException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jp.co.recruit.riscon.entity.BelongsOrganizations;
import jp.co.recruit.riscon.entity.Organizations;
import jp.co.recruit.riscon.entity.Users;

@Service
@Transactional
public class UsersService {
    @PersistenceContext
    private EntityManager entityManager;

    public Users findUsers(String username) {
          try {
              return (Users) entityManager.createNativeQuery("SELECT * FROM users WHERE username=?1",Users.class)
                 .setParameter(1, username)
                 .getSingleResult();
          } catch(NoResultException e) {
              return null;
          }
    }

    @SuppressWarnings("unchecked")
    public List<BelongsOrganizations> findBelongsOrganizations(String username){
        return entityManager.createNativeQuery("SELECT * FROM belongs_organizations WHERE username=?1",BelongsOrganizations.class)
                .setParameter(1, username)
                .getResultList();
    }

    public Organizations findOrganizations(Integer orgId){
        return (Organizations) entityManager.createNativeQuery("SELECT * from organizations where id=?1",Organizations.class).setParameter(1, orgId).getSingleResult();
    }

    @SuppressWarnings("unchecked")
    public List<Organizations> findOrganizations(){
        return entityManager.createNativeQuery("SELECT * from organizations",Organizations.class).getResultList();
    }

    public void deleteBelongsOrganizations(String username) {
        entityManager.createNativeQuery("DELETE FROM belongs_organizations WHERE username=?1").setParameter(1, username).executeUpdate();
    }

    public void insertOrganization(String[] organizations,String username) {
        for(String organization:organizations) {
            entityManager.createNativeQuery("INSERT INTO belongs_organizations (organization_id, username) VALUES (?1, ?2)")
            .setParameter(1, organization)
            .setParameter(2, username).executeUpdate();
        }
    }

    public void updateUsersWithIcon(String firstName,String lastName,String icon,String username) {
        entityManager.createNativeQuery("UPDATE users SET first_name=?1, last_name=?2, icon=?3 WHERE username=?4")
            .setParameter(1, firstName)
            .setParameter(2, lastName)
            .setParameter(3, icon)
            .setParameter(4, username)
            .executeUpdate();
    }

    public void updateUsers(String firstName,String lastName,String username) {
        entityManager.createNativeQuery("UPDATE users SET first_name=?1, last_name=?2 WHERE username=?3")
            .setParameter(1, firstName)
            .setParameter(2, lastName)
            .setParameter(3, username)
            .executeUpdate();
    }
}
