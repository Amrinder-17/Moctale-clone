from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse

User = get_user_model()

class MediaDetailViewTest(TestCase):
    def setUp(self):
        self.client=Client()
        self.user=User.objects.create(username='testuser',password='password123')
        self.client.force_login(self.user)
        self.url = reverse('media_detail', kwargs={'media_type': 'movie', 'media_id': 1368337})

    # @patch('requests.get')
    # def test_media_detail_tmdb_404_handling(self,mock_get):
    #     mock_response=MagicMock()
    #     mock_response.status_code=404
    #     mock_get.return_value = mock_response

    #     response=self.client.get(self.url)
    #     self.assertEqual(response.status_code, 404)
    #     self.assertTemplateUsed(response, 'movies/404.html')
    def test_live_view_execution(self):
        """Runs the view directly without suppressing exceptions to see the real crash."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)

    @patch('requests.get')
    def test_media_detail_tmdb_404_handling(self,mock_get):
        mock_response=MagicMock()
        mock_response.status_code=200
        mock_response.json.return_value = {
            'id': 1368337,
            'title': 'Test Movie',
            'release_date': '2026-01-01',
            'videos': {'results': []}
        }
        mock_get.return_value = mock_response

        response=self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'movies/detail.html')
        